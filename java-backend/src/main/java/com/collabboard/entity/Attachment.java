package com.collabboard.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "Attachment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "fileSize", nullable = false)
    private int fileSize;

    @Column(name = "mimeType", nullable = false)
    private String mimeType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cardId", nullable = false)
    private Card card;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploadedById", nullable = false)
    private User uploadedBy;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (id == null)
            id = UUID.randomUUID().toString();
        if (createdAt == null)
            createdAt = Instant.now();
    }
}