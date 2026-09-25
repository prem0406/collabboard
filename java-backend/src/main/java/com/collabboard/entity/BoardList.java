package com.collabboard.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "List")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardList {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "position", nullable = false)
    private int position;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "boardId", nullable = false)
    private Board board;

    @PrePersist
    void prePersist() {
        if (id == null)
            id = java.util.UUID.randomUUID().toString();
    }
}