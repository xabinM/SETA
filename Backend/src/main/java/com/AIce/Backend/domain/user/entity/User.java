package com.AIce.Backend.domain.user.entity;

import com.AIce.Backend.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.crypto.password.PasswordEncoder;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true, length = 20)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    public static User from(String username, String encodedPassword, String name) {
        return new User(
                username,
                encodedPassword,
                name
        );
    }

    protected User(String username, String password, String name) {
        this.username = username;
        this.password = password;
        this.name = name;
    }

    public boolean isPasswordMatching(PasswordEncoder encoder, String rawPassword) {
        return encoder.matches(rawPassword, this.password);
    }
}
