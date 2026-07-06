package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "chat_rooms")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "is_group", nullable = false)
    private Boolean isGroup = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "chat_room_members", joinColumns = @JoinColumn(name = "chat_room_id"))
    @Column(name = "user_id")
    private Set<Long> memberUserIds = new HashSet<>();

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (isGroup == null) isGroup = false;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Boolean getIsGroup() { return isGroup; }
    public void setIsGroup(Boolean isGroup) { this.isGroup = isGroup; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public Set<Long> getMemberUserIds() { return memberUserIds; }
    public void setMemberUserIds(Set<Long> memberUserIds) { this.memberUserIds = memberUserIds; }
}
