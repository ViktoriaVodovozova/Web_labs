const list = (v, d) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : d);

export const config = {
  port: +process.env.PORT || 3001,
  dataDir: process.env.DATA_DIR || './data',

  // --- Java-backend (ЛР3): подстройте под свои эндпоинты ---
  javaUrl: process.env.JAVA_URL || 'http://java-backend:8000',
  profilePath: process.env.JAVA_PROFILE_PATH || '/api/auth/me', // GET -> {id, username, role}
  studentsPath: process.env.JAVA_STUDENTS_PATH || '/api/requests', // GET page/POST/PUT {id}

  // Общий секрет для служебных вызовов Java -> Node (/internal/*)
  serviceKey: process.env.SERVICE_KEY || '',

  // Допустимые Origin для WebSocket
  allowedOrigins: list(process.env.ALLOWED_ORIGINS, ['http://localhost']),

  // --- Модель студента для CSV ---
  fields: list(process.env.FIELDS, ['id', 'fullName', 'group', 'isuId', 'dormitory', 'room', 'moveInDate', 'isForeigner', 'notes']),
  requiredFields: list(process.env.REQUIRED_FIELDS, ['fullName', 'group', 'isuId', 'dormitory', 'room', 'moveInDate']),
  numericFields: list(process.env.NUMERIC_FIELDS, ['dormitory', 'room']),
  // Поле версии для обнаружения конфликтов (например updatedAt или version). null = не используется
  versionField: process.env.VERSION_FIELD || null,

  // --- Роли ---
  auditRoles: list(process.env.AUDIT_ROLES, ['ADMIN']),
  importExportRoles: list(process.env.IMPORT_EXPORT_ROLES, ['ADMIN']),

  maxImportBytes: 50 * 1024 * 1024,
  pageSize: 100,
  heartbeatMs: +process.env.HEARTBEAT_MS || 30_000,
  ticketTtlMs: 30_000,
  jobTtlMs: 60 * 60 * 1000,
};
