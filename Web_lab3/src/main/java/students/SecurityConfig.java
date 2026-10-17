package students;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import students.ErrorHandler.ApiException;
import java.io.IOException;
import java.util.List;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AuthService auth,
        UserRepository users, ObjectMapper mapper) throws Exception {
        var filter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                FilterChain chain) throws ServletException, IOException {
                String header = request.getHeader("Authorization");
                if (header != null) {
                    try {
                        if (!header.startsWith("Bearer ")) throw new ApiException(401, "Ожидается Bearer-токен");
                        String id = auth.parse(header.substring(7), "access").getSubject();
                        User user = users.findById(id).orElseThrow(() -> new ApiException(401, "Пользователь не найден"));
                        var authentication = new UsernamePasswordAuthenticationToken(user.username, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + user.role)));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (ApiException e) {
                        SecurityContextHolder.clearContext();
                        ErrorHandler.writeError(mapper, response, e.getStatus(), e.getMessage());
                        return;
                    }
                }
                chain.doFilter(request, response);
            }
        };
        http.csrf(c -> c.disable()).formLogin(f -> f.disable()).httpBasic(b -> b.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/auth/**", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/requests", "/api/requests/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/requests", "/api/requests/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated().anyRequest().permitAll())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> ErrorHandler.writeError(mapper, res, 401, "Необходима авторизация"))
                .accessDeniedHandler((req, res, ex) -> ErrorHandler.writeError(mapper, res, 403, "Недостаточно прав")))
            .addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
