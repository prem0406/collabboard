package com.collabboard.repository;

import com.collabboard.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, String> {
    List<Attachment> findAllByCardIdOrderByCreatedAtAsc(String cardId);
}