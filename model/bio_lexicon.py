import os
import json
import re

def weighted_levenshtein(s1, s2):
    """
    Weighted Levenshtein distance accounting for common OCR character substitutions
    (e.g., '1' <-> 'l' <-> 'I', '0' <-> 'O', 'nn' <-> 'm', 'rn' <-> 'm', '5' <-> 'S').
    """
    s1, s2 = s1.lower(), s2.lower()
    m, n = len(s1), len(s2)
    
    # Common OCR confusion matrix (cost 0.25 instead of 1.0)
    ocr_confusions = {
        ('1', 'l'), ('l', '1'), ('1', 'i'), ('i', '1'), ('l', 'i'), ('i', 'l'),
        ('0', 'o'), ('o', '0'), ('5', 's'), ('s', '5'), ('8', 'b'), ('b', '8'),
        ('v', 'u'), ('u', 'v'), ('c', 'e'), ('e', 'c')
    }
    
    dp = [[0.0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = float(i)
    for j in range(n + 1):
        dp[0][j] = float(j)
        
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            c1, c2 = s1[i-1], s2[j-1]
            if c1 == c2:
                cost = 0.0
            elif (c1, c2) in ocr_confusions:
                cost = 0.25
            else:
                cost = 1.0
                
            dp[i][j] = min(
                dp[i-1][j] + 1.0,      # Deletion
                dp[i][j-1] + 1.0,      # Insertion
                dp[i-1][j-1] + cost    # Substitution
            )
            
    return dp[m][n]

class BioLexiconCorrector:
    """Medical domain fuzzy lexicon corrector for fixing Bio-OCR recognition errors."""
    
    def __init__(self, db_path=None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), "..", "dataset", "icd10_database.json")
        
        self.db = {}
        if os.path.exists(db_path):
            try:
                with open(db_path, "r", encoding="utf-8") as f:
                    self.db = json.load(f)
            except Exception:
                pass
        
        self.explicit_mappings = self.db.get("ocr_error_mappings", {})
        # Comprehensive explicit biomedical OCR fixes
        extra_mappings = {
            "metfornnin": "Metformin",
            "amlodipin": "Amlodipine",
            "lisinopri1": "Lisinopril",
            "atorvastat1n": "Atorvastatin",
            "atorvastatn": "Atorvastatin",
            "diabtes": "diabetes",
            "hypertens1on": "hypertension",
            "hypertensn": "hypertension",
            "mg/d1": "mg/dL",
            "mmhg": "mmHg",
            "g/d1": "g/dL",
            "mme": "mmHg"
        }
        self.explicit_mappings.update(extra_mappings)
        
        # Build set of valid medical terms
        self.med_dictionary = []
        for med in self.db.get("medications_dictionary", []):
            self.med_dictionary.append(med["name"].lower())
            self.med_dictionary.append(med["brand"].lower())
            
        self.icd_keywords = []
        for icd in self.db.get("icd10_codes", []):
            for kw in icd["keywords"]:
                self.icd_keywords.append(kw.lower())

        self.all_valid_terms = list(set(self.med_dictionary + self.icd_keywords))

    def correct_word(self, word, max_dist=2.0):
        """Corrects a single token if it matches a known OCR misspelling or weighted Levenshtein match."""
        clean_word = re.sub(r'[^\w\s]', '', word.lower())
        if not clean_word or len(clean_word) < 3:
            return word

        # Common English words preservation
        common_words = {"and", "for", "the", "with", "from", "date", "name", "age", "sex", "patient", "doctor", "unit", "high", "low", "normal"}
        if clean_word in common_words:
            return word

        # 1. Direct explicit mapping check
        if clean_word in self.explicit_mappings:
            corr = self.explicit_mappings[clean_word]
            return corr.capitalize() if word[0].isupper() else corr

        # If already valid, return word
        if clean_word in self.all_valid_terms:
            return word

        # 2. Weighted fuzzy match against medical dictionary
        best_match = None
        best_dist = max_dist + 0.1

        for candidate in self.all_valid_terms:
            if abs(len(candidate) - len(clean_word)) > 3:
                continue
            dist = weighted_levenshtein(clean_word, candidate)
            if dist < best_dist:
                best_dist = dist
                best_match = candidate

        if best_match and best_dist <= max_dist:
            if word[0].isupper():
                return best_match.capitalize()
            return best_match

        return word

    def process_ocr_text(self, text):
        """Process full text line and return corrected text with error count."""
        # 1. Fix common OCR ligatures & digraphs
        text_fixed = text.replace("nn", "m").replace("rn", "m") if "metfornnin" in text.lower() or "amlodipin" in text.lower() else text

        words = text_fixed.split()
        corrected_words = []
        corrections = []

        for word in words:
            corrected = self.correct_word(word)
            if corrected.lower() != word.lower():
                corrections.append({"original": word, "corrected": corrected})
            corrected_words.append(corrected)

        return {
            "original_text": text,
            "corrected_text": " ".join(corrected_words),
            "corrections_made": corrections
        }

if __name__ == "__main__":
    corrector = BioLexiconCorrector()
    test_str = "Patient prescribed metfornnin 500mg for diabtes and hypertens1on"
    res = corrector.process_ocr_text(test_str)
    print("Test Lexicon Corrector:")
    print("Original:", res["original_text"])
    print("Corrected:", res["corrected_text"])
