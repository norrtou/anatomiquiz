#!/usr/bin/env python3
import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'data' / 'questions.json'

# Existing factual questions (kept as provided). Do NOT modify facts here without verification.
base_questions = [
  {
    "id": "q1",
    "type": "tf",
    "prompt": "DIP2-leden ligger distalt om CMC2-leden.",
    "correct": "Sant",
    "distractors": ["Falskt"],
    "topic": "hand",
    "difficulty": "easy",
    "source": "Terminologia Anatomica, läroböcker i anatomi"
  },
  {
    "id": "q2",
    "type": "tf",
    "prompt": "Cor (hjärtat) ligger caudalt och medialt om maxilla.",
    "correct": "Sant",
    "distractors": ["Falskt"],
    "topic": "organ",
    "difficulty": "medium",
    "source": "Lärobok i medicinsk anatomi"
  },
  {
    "id": "q3",
    "type": "mc",
    "prompt": "Vilket påstående om femur och tibia är korrekt?",
    "correct": "Femur ligger proximalt om tibia",
    "distractors": ["Femur ligger distal om tibia","De ligger lateralt om varandra","Femur ligger ventralt om tibia"],
    "topic": "skelett",
    "difficulty": "easy",
    "source": "Terminologia Anatomica"
  },
  {
    "id": "q4",
    "type": "tf",
    "prompt": "Radius ligger medialt om ulna i anatomisk grundposition.",
    "correct": "Falskt",
    "distractors": ["Sant"],
    "topic": "skelett",
    "difficulty": "medium",
    "source": "Anatomibok / klinisk anatomi"
  },
  {
    "id": "q5",
    "type": "mc",
    "prompt": "Vilket påstående om patella och femur är korrekt?",
    "correct": "Patella ligger anterior om femur",
    "distractors": ["Patella ligger medialt om femur","Patella ligger proximalt om femur","Patella ligger posterior om femur"],
    "topic": "skelett",
    "difficulty": "easy",
    "source": "Terminologia Anatomica"
  },
  {
    "id": "q6",
    "type": "mc",
    "prompt": "Vilket påstående om scapula är sant?",
    "correct": "Scapula ligger lateralt om columna thoracica",
    "distractors": ["Scapula ligger medialt","Scapula ligger ventralt","Scapula ligger kaudalt om columna"],
    "topic": "skelett",
    "difficulty": "medium",
    "source": "Klinisk anatomi"
  },
  {
    "id": "q7",
    "type": "mc",
    "prompt": "Vilket påstående om biceps och triceps är korrekt?",
    "correct": "Biceps brachii ligger superficielt i förhållande till triceps brachii på överarmens anteriora sida",
    "distractors": ["Biceps ligger posterior","Biceps är djupare än triceps","De ligger i samma plan"],
    "topic": "muskler",
    "difficulty": "medium",
    "source": "Muskellära / anatomibok"
  },
  {
    "id": "q8",
    "type": "mc",
    "prompt": "Vilket påstående om maxilla och mandibula är korrekt?",
    "correct": "Maxilla ligger superiort om mandibula",
    "distractors": ["De ligger i samma nivå","Mandibula ligger superiort","Maxilla ligger lateralt om mandibula"],
    "topic": "skelett",
    "difficulty": "easy",
    "source": "Terminologia Anatomica"
  }
]

def generate(target_count=500):
    out = list(base_questions)
    start = len(out) + 1
    for i in range(start, target_count+1):
        pid = f"ph{str(i).zfill(3)}"
        out.append({
            "id": pid,
            "type": "mc",
            "prompt": f"Plats för fråga {i} (placeholder). Importera riktig fråga senare.",
            "correct": "Placeholder korrekt svar",
            "distractors": ["Placeholder alternativ 1","Placeholder alternativ 2","Placeholder alternativ 3"],
            "topic": "placeholder",
            "difficulty": "easy",
            "source": "placeholder"
        })
    return out

def main():
    data = generate(500)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {len(data)} questions to {OUT}')

if __name__ == '__main__':
    main()
