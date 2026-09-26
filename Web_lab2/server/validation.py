import re
from datetime import date

NAME_REGEX = re.compile(r"^[a-zA-Zа-яА-ЯёЁ\s\-']+$")

def validate_student(student: dict) -> dict:
    """Возвращает словарь ошибок (пустой, если всё ок)."""
    errors = {}

    # ФИО
    full_name = student.get("fullName", "").strip()
    if not full_name:
        errors["fullName"] = "ФИО обязательно для заполнения"
    elif not NAME_REGEX.match(full_name):
        errors["fullName"] = "ФИО должно содержать только буквы, пробелы, дефис или апостроф"

    # Группа
    if not student.get("group", "").strip():
        errors["group"] = "Группа обязательна"

    # ИСУ ID
    isu_id = student.get("isuId", "")
    if not isu_id:
        errors["isuId"] = "ИСУ ID обязателен"
    elif not re.match(r"^\d{6}$", str(isu_id)):
        errors["isuId"] = "ИСУ ID должен содержать ровно 6 цифр"

    # Общежитие
    dormitory = student.get("dormitory")
    if dormitory is None or not isinstance(dormitory, int) or dormitory < 1:
        errors["dormitory"] = "Номер общежития должен быть положительным числом"

    # Комната
    room = student.get("room")
    if room is None or not isinstance(room, int) or room < 1:
        errors["room"] = "Комната должна быть положительным числом"

    # Дата
    move_in = student.get("moveInDate", "")
    if not move_in:
        errors["moveInDate"] = "Срок заселения обязателен"
    else:
        try:
            d = date.fromisoformat(move_in)
            min_date = date(1970, 8, 25)
            max_date = date.today()
            if d < min_date:
                errors["moveInDate"] = "Дата не может быть раньше 25.08.1970"
            elif d > max_date:
                errors["moveInDate"] = "Дата не может быть позже сегодняшнего дня"
        except ValueError:
            errors["moveInDate"] = "Неверный формат даты (нужно YYYY-MM-DD)"

    return errors