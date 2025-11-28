package com.AIce.Backend.global.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
public class DataSourceConfig {

    // --- Primary DataSource 설정 ---
    @Bean("customPrimaryDataSourceProperties") // Bean 이름 명시적으로 변경
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties customPrimaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "primaryDataSource")
    @ConfigurationProperties("spring.datasource.hikari")
    // 위에서 생성한 Properties Bean을 주입받도록 변경
    public DataSource primaryDataSource(@Qualifier("customPrimaryDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    // --- Replica DataSource 설정 ---
    @Bean("customReplicaDataSourceProperties") // Bean 이름 명시적으로 변경
    @ConfigurationProperties("spring.replica-datasource")
    public DataSourceProperties customReplicaDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "replicaDataSource")
    @ConfigurationProperties("spring.replica-datasource.hikari")
    // 위에서 생성한 Properties Bean을 주입받도록 변경
    public DataSource replicaDataSource(@Qualifier("customReplicaDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    // --- 라우팅 설정 (기존과 동일) ---
    @Bean
    public DataSource routingDataSource(@Qualifier("primaryDataSource") DataSource primaryDataSource,
                                        @Qualifier("replicaDataSource") DataSource replicaDataSource) {
        RoutingDataSource routingDataSource = new RoutingDataSource();
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(DataSourceType.PRIMARY, primaryDataSource);
        targetDataSources.put(DataSourceType.REPLICA, replicaDataSource);
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource);
        return routingDataSource;
    }

    @Bean("routingDataSourceProxy")
    @Primary
    public DataSource routingDataSourceProxy(@Qualifier("routingDataSource") DataSource routingDataSource) {
        return new LazyConnectionDataSourceProxy(routingDataSource);
    }
}

class RoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContextHolder.getDataSourceType();
    }
}
