package com.textile.management.repository;

import com.textile.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.lastLogin = :lastLogin WHERE u.email = :email")
    void updateLastLogin(@Param("email") String email, @Param("lastLogin") LocalDateTime lastLogin);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.resetToken = :token, u.resetTokenExpiry = :expiry WHERE u.email = :email")
    void updateResetToken(@Param("email") String email, @Param("token") String token, @Param("expiry") LocalDateTime expiry);

    Optional<User> findByResetToken(String resetToken);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.passwordHash = :password, u.resetToken = null, u.resetTokenExpiry = null WHERE u.resetToken = :token")
    void updatePasswordByResetToken(@Param("token") String token, @Param("password") String password);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.isActive = :isActive WHERE u.userId = :userId")
    void updateUserStatus(@Param("userId") Integer userId, @Param("isActive") Boolean isActive);
}