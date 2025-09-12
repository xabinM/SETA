package com.AIce.Backend.auth.jwt;

import com.AIce.Backend.global.exception.BusinessException;
import com.AIce.Backend.global.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.PathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final List<String> WHITELIST = List.of(
            "/auth/signup", "/auth/login", "/auth/reissue"
    );

    private static final List<String> WHITELIST_PATTERNS = List.of(
            "/sse/**", "/swagger-ui/**", "/v3/api-docs/**"
    );

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationEntryPoint entryPoint;
    private final PathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();

        if (WHITELIST.contains(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 패턴 매칭 (SSE, Swagger 등)
        for (String pattern : WHITELIST_PATTERNS) {
            if (pathMatcher.match(pattern, uri)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        try {
            String token = jwtTokenProvider.resolveToken(request);

            if (StringUtils.hasText(token)) {
                jwtTokenProvider.validateToken(token);

                Long userId = jwtTokenProvider.getUserIdFromToken(token);


                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, null);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

            filterChain.doFilter(request, response);
        } catch (AuthenticationException e) {
            SecurityContextHolder.clearContext();
            entryPoint.commence(request, response, e);
        } catch (BusinessException e) {
            SecurityContextHolder.clearContext();
            setErrorResponse(response, e.getHttpStatus(), e.getCode(), e.getMessage());
        }
    }

    private void setErrorResponse(HttpServletResponse response, HttpStatus status, String code, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json;charset=UTF-8");

        ErrorResponse errorResponse = new ErrorResponse(code, message);
        String json = new ObjectMapper().writeValueAsString(errorResponse);
        response.getWriter().write(json);
    }
}
