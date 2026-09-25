package com.collabboard.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "WorkspaceMember", uniqueConstraints = @UniqueConstraint(columnNames = { "userId", "workspaceId" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceMember {

    @Id
    @Column(name = "id")
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspaceId", nullable = false)
    private Workspace workspace;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (id == null)
            id = UUID.randomUUID().toString();
        if (createdAt == null)
            createdAt = Instant.now();
        if (role == null)
            role = Role.MEMBER;
    }
}