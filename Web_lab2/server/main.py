import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles

from .routes import router

app = FastAPI(title="Students API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# роуты API
app.include_router(router)


# единый формат ошибок валидации
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "detail": exc.errors()},
    )


# путь к папке frontend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

print(f"[INFO] Отдаём статику из: {FRONTEND_DIR}")
print(f"[INFO] Файлы: {os.listdir(FRONTEND_DIR) if os.path.exists(FRONTEND_DIR) else 'папка не найдена'}")


# явный обработчик главной страницы
@app.get("/", include_in_schema=False)
async def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(status_code=404, content={"detail": "index.html не найден"})


# отдаём остальную статику (css, js, html- файлы по прямым ссылкам)
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")

# python -m uvicorn server.main:app --reload --port 8000
