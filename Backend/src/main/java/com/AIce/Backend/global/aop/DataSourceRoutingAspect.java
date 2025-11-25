package com.AIce.Backend.global.aop;

import com.AIce.Backend.global.annotation.ReadOnlyTransactional;
import com.AIce.Backend.global.config.DataSourceContextHolder;
import com.AIce.Backend.global.config.DataSourceType;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Aspect
@Component
@Order(1) // @Transactional 보다 먼저 실행되도록 우선순위를 높게 설정 (낮은 숫자가 높은 우선순위)
@Slf4j
public class DataSourceRoutingAspect {

    @Around("@annotation(readOnlyTransactional)")
    public Object routeDataSource(ProceedingJoinPoint joinPoint, ReadOnlyTransactional readOnlyTransactional) throws Throwable {
        // 현재 트랜잭션이 활성화되어 있는지 확인합니다.
        // 이미 트랜잭션이 활성화되어 있다면 (예: 쓰기 트랜잭션이 진행 중이거나,
        // 이미 데이터소스가 결정된 경우), 데이터소스 라우팅을 건너뛰고 기존 트랜잭션을 따릅니다.
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            log.debug("Active transaction detected. Skipping data source routing for read-only operation: {}", joinPoint.getSignature().toShortString());
            return joinPoint.proceed();
        }

        try {
            log.debug("Setting data source to REPLICA for read-only operation: {}", joinPoint.getSignature().toShortString());
            DataSourceContextHolder.setDataSourceType(DataSourceType.REPLICA);
            return joinPoint.proceed();
        } finally {
            DataSourceContextHolder.clearDataSourceType();
            log.debug("Cleared data source type after read-only operation: {}", joinPoint.getSignature().toShortString());
        }
    }
}
