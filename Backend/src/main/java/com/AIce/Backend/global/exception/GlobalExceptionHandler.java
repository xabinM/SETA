package com.AIce.Backend.global.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // validation 글로벌 예외 처리기
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String firstErrorMessage = ex.getBindingResult()
                .getFieldErrors()
                .get(0)
                .getDefaultMessage();

        BusinessException e = new ValidationException(firstErrorMessage);
        return buildErrorResponse(e);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        return buildErrorResponse(e);
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(BusinessException e) {
        ErrorResponse error = new ErrorResponse(e.getCode(), e.getMessage());
        return new ResponseEntity<>(error, e.getHttpStatus());
    }
}
