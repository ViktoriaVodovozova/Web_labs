from pydantic import BaseModel, Field
from typing import Optional

class Student(BaseModel):
    id: Optional[str] = None          # генерируется на сервере
    fullName: str = Field(..., min_length=1)
    group: str = Field(..., min_length=1)
    isuId: str = Field(..., pattern=r"^\d{6}$")   # ровно 6 цифр
    dormitory: int = Field(..., ge=1)
    room: int = Field(..., ge=1)
    moveInDate: str                    # YYYY-MM-DD
    isForeigner: bool = False
    notes: str = ""

class StudentUpdate(BaseModel):
    fullName: Optional[str] = None
    group: Optional[str] = None
    isuId: Optional[str] = None
    dormitory: Optional[int] = None
    room: Optional[int] = None
    moveInDate: Optional[str] = None
    isForeigner: Optional[bool] = None
    notes: Optional[str] = None