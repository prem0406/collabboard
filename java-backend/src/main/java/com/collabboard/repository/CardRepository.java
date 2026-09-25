package com.collabboard.repository;

import com.collabboard.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CardRepository extends JpaRepository<Card, String> {
    List<Card> findAllByListIdOrderByPositionAsc(String listId);

    long countByListId(String listId);
}