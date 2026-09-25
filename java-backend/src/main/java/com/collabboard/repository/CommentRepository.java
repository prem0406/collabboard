package com.collabboard.repository;

import com.collabboard.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findAllByCardIdOrderByCreatedAtAsc(String cardId);
}