package com.AIce.Backend.global;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@RestController
public class DebugController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/hikari-status")
    public Map<String, Object> getHikariStatus() {
        HikariDataSource hds = (HikariDataSource) dataSource;
        HikariPoolMXBean poolBean = hds.getHikariPoolMXBean();

        Map<String, Object> status = new HashMap<>();
        status.put("activeConnections", poolBean.getActiveConnections());
        status.put("idleConnections", poolBean.getIdleConnections());
        status.put("totalConnections", poolBean.getTotalConnections());
        status.put("threadsAwaitingConnection", poolBean.getThreadsAwaitingConnection());

        return status;
    }
}