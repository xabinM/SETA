package com.AIce.Backend.global.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableJpaRepositories(basePackages = "com.AIce.Backend") // JPA Repository가 위치한 기본 패키지 지정
@EntityScan(basePackages = "com.AIce.Backend") // Entity 클래스가 위치한 기본 패키지 지정
public class JpaConfig {

    // EntityManagerFactory 설정
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(@Qualifier("dataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.AIce.Backend"); // Entity 패키지 스캔

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        // application.yml의 JPA 속성들을 여기에 설정하거나,
        // Spring Boot의 자동 설정을 활용할 수 있습니다.
        // 여기서는 예시로 몇 가지를 직접 설정합니다.
        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "validate"); // 운영 환경에서는 validate 또는 none
        properties.put("hibernate.format_sql", "true");
        properties.put("hibernate.show_sql", "true"); // application.yml에서 설정했으므로 중복될 수 있음
        // properties.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect"); // 사용하는 DB에 맞게 설정
        em.setJpaPropertyMap(properties);

        return em;
    }

    // 트랜잭션 매니저 설정
    @Bean
    public PlatformTransactionManager transactionManager(LocalContainerEntityManagerFactoryBean entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory.getObject());
        return transactionManager;
    }
}
