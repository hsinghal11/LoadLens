package com.himanshu.loadlens.config;

import com.himanshu.loadlens.entity.Provider;
import com.himanshu.loadlens.entity.Role;
import com.himanshu.loadlens.entity.User;
import com.himanshu.loadlens.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.auth.frontend.success-redirect}")
    private String successRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;
        String registrationId = authToken.getAuthorizedClientRegistrationId();
        OAuth2User oAuth2User = authToken.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            String login = oAuth2User.getAttribute("login");
            email = login != null ? login + "@github.com" : oAuth2User.getName() + "@oauth.com"; 
        }
        
        String name = oAuth2User.getAttribute("name");
        if (name == null) {
            name = oAuth2User.getAttribute("login");
        }

        String avatarUrl = oAuth2User.getAttribute("picture"); // Google
        if (avatarUrl == null) {
            avatarUrl = oAuth2User.getAttribute("avatar_url"); // GitHub
        }

        Provider provider = registrationId.equalsIgnoreCase("google") ? Provider.GOOGLE : Provider.GITHUB;

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setName(name != null ? name : "OAuth User");
            // Set random password as it's required by the DB schema
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setRole(Role.USER);
            user.setProvider(provider);
            user.setEnabled(true);
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
        } else {
            // Update provider if previously local, and grab avatar if newly available
            boolean isUpdated = false;
            if (user.getProvider() == Provider.LOCAL) {
                user.setProvider(provider);
                isUpdated = true;
            }
            if (user.getAvatarUrl() == null && avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
                isUpdated = true;
            }
            if (isUpdated) {
                userRepository.save(user);
            }
        }

        String jwtToken = jwtService.generateToken(user);
        
        String targetUrl = UriComponentsBuilder.fromUriString(successRedirectUrl)
                .queryParam("token", jwtToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
