package students.exception;


import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.*;

@RestControllerAdvice
public class ErrorHandler {
    public static class ApiException extends RuntimeException {
        private final int status;
        private final Map<String, String> detail;
    
        public ApiException(int status, String message) { this(status, message, Map.of("message", message)); }
    
        public ApiException(int status, String message, Map<String, String> detail) {
            super(message);
            this.status = status;
            this.detail = Map.copyOf(detail);
        }
    
        public int getStatus() { return status; }
        public Map<String, String> getDetail() { return detail; }
    }

    private static final Logger log = LoggerFactory.getLogger(ErrorHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(body(e.getMessage(), e.getDetail()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> detail = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(v -> detail.putIfAbsent(v.getField(), v.getDefaultMessage()));
        return ResponseEntity.status(422).body(body("Ошибка валидации", detail));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception e) {
        return error(400, "Некорректный формат запроса или параметров");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(DataIntegrityViolationException e) {
        log.warn("Нарушено ограничение базы данных");
        return error(409, "Данные конфликтуют с ограничениями базы");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoResourceFoundException e) {
        return error(404, "Ресурс не найден");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethod(HttpRequestMethodNotSupportedException e) {
        return error(405, "Метод не поддерживается");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMedia(HttpMediaTypeNotSupportedException e) {
        return error(415, "Неподдерживаемый Content-Type");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception e) {
        log.error("Необработанная ошибка сервера", e);
        return error(500, "Внутренняя ошибка сервера");
    }

    public static void writeError(ObjectMapper mapper, HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getWriter(), body(message, Map.of("message", message)));
    }

    private ResponseEntity<Map<String, Object>> error(int status, String message) {
        return ResponseEntity.status(status).body(body(message, Map.of("message", message)));
    }

    private static Map<String, Object> body(String error, Map<String, String> detail) {
        return Map.of("error", error, "detail", detail);
    }
}
