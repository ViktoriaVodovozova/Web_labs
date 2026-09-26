import json
import os
from typing import List, Optional

DATA_FILE = os.path.join(os.path.dirname(__file__), "students.json")

def _load() -> List[dict]:
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _save(students: List[dict]) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(students, f, ensure_ascii=False, indent=2)

def get_all(filters: Optional[dict] = None) -> List[dict]:
    students = _load()
    if filters:
        for key, value in filters.items():
            if value is None or value == "":
                continue
            students = [s for s in students if str(s.get(key)) == str(value)]
    return students

def get_by_id(student_id: str) -> Optional[dict]:
    for s in _load():
        if s["id"] == student_id:
            return s
    return None

def get_by_isu(isu_id: str) -> Optional[dict]:
    for s in _load():
        if s["isuId"] == isu_id:
            return s
    return None

def add(student: dict) -> dict:
    students = _load()
    students.append(student)
    _save(students)
    return student

def update(student_id: str, updated: dict) -> Optional[dict]:
    students = _load()
    for i, s in enumerate(students):
        if s["id"] == student_id:
            for key, value in updated.items():
                if value is not None:
                    s[key] = value
            students[i] = s
            _save(students)
            return s
    return None

def delete(student_id: str) -> bool:
    students = _load()
    filtered = [s for s in students if s["id"] != student_id]
    if len(filtered) == len(students):
        return False
    _save(filtered)
    return True