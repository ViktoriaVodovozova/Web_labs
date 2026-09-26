import uuid
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from typing import Optional, List

from .models import Student, StudentUpdate
from . import storage, validation

router = APIRouter(prefix="/api/requests", tags=["students"])

# ---------- GET /api/requests ----------
@router.get("")
def list_students(
    group: Optional[str] = Query(None),
    dormitory: Optional[int] = Query(None),
    isForeigner: Optional[bool] = Query(None),
):
    filters = {}
    if group: filters["group"] = group
    if dormitory is not None: filters["dormitory"] = dormitory
    if isForeigner is not None: filters["isForeigner"] = isForeigner
    return storage.get_all(filters)

# ---------- GET /api/requests/:id ----------
@router.get("/{student_id}")
def get_student(student_id: str):
    student = storage.get_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    return student

# ---------- POST /api/requests ----------
@router.post("", status_code=201)
def create_student(student: Student):
    data = student.dict()
    # валидация
    errors = validation.validate_student(data)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    # проверка уникальности ИСУ ID
    if storage.get_by_isu(data["isuId"]):
        raise HTTPException(status_code=409, detail="Студент с таким ИСУ ID уже существует")
    # генерируем ID
    data["id"] = str(uuid.uuid4())
    return storage.add(data)

# ---------- PATCH /api/requests/:id ----------
@router.patch("/{student_id}")
def update_student(student_id: str, student: StudentUpdate):
    existing = storage.get_by_id(student_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Студент не найден")
    # мерджим данные
    merged = {**existing, **{k: v for k, v in student.dict().items() if v is not None}}
    errors = validation.validate_student(merged)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    # если ИСУ ID меняется – проверяем уникальность
    if student.isuId and student.isuId != existing["isuId"]:
        if storage.get_by_isu(student.isuId):
            raise HTTPException(status_code=409, detail="Студент с таким ИСУ ID уже существует")
    return storage.update(student_id, student.dict(exclude_none=True))

# ---------- DELETE /api/requests/:id ----------
@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: str):
    if not storage.delete(student_id):
        raise HTTPException(status_code=404, detail="Студент не найден")
    return JSONResponse(status_code=204, content=None)