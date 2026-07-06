package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.entity.ChatRoom;
import com.nexorcrm.backend.entity.ChatMessage;
import com.nexorcrm.backend.entity.ChatRoomUserSetting;
import com.nexorcrm.backend.entity.UserBlock;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.ChatRoomRepository;
import com.nexorcrm.backend.repo.ChatMessageRepository;
import com.nexorcrm.backend.repo.ChatRoomUserSettingRepository;
import com.nexorcrm.backend.repo.UserBlockRepository;
import com.nexorcrm.backend.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatRoomController {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatRoomUserSettingRepository chatRoomUserSettingRepository;
    private final UserBlockRepository userBlockRepository;

    public ChatRoomController(ChatRoomRepository chatRoomRepository,
                              ChatMessageRepository chatMessageRepository,
                              UserRepository userRepository,
                              ChatRoomUserSettingRepository chatRoomUserSettingRepository,
                              UserBlockRepository userBlockRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.chatRoomUserSettingRepository = chatRoomUserSettingRepository;
        this.userBlockRepository = userBlockRepository;
    }

    private User getActor(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String principal = authentication.getName();
        return principal.contains("@")
                ? userRepository.findByEmailAndIsDeletedFalse(principal.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED))
                : userRepository.findByUsernameAndIsDeletedFalse(principal.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping("/users")
    public List<Map<String, Object>> listUsers(Authentication authentication) {
        User actor = getActor(authentication);
        List<User> all = userRepository.findAll();
        
        // Load blocked users to filter them out
        List<Long> blockedUserIds = userBlockRepository.findByUserId(actor.getId()).stream()
                .map(UserBlock::getBlockedUserId)
                .toList();

        List<Map<String, Object>> res = new ArrayList<>();
        for (User u : all) {
            if (u.isDeleted()) continue;
            if (u.getId().equals(actor.getId())) continue;
            if (blockedUserIds.contains(u.getId())) continue;
            
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("role", u.getRole() != null ? u.getRole().name() : null);
            res.add(m);
        }
        return res;
    }

    @GetMapping("/rooms")
    public List<Map<String, Object>> listRooms(Authentication authentication) {
        User actor = getActor(authentication);
        List<ChatRoom> rooms = chatRoomRepository.findRoomsByMemberUserId(actor.getId());
        List<Map<String, Object>> res = new ArrayList<>();
        
        for (ChatRoom r : rooms) {
            Optional<ChatRoomUserSetting> optSetting = chatRoomUserSettingRepository
                    .findByChatRoomIdAndUserId(r.getId(), actor.getId());
            
            boolean isMuted = optSetting.map(ChatRoomUserSetting::getIsMuted).orElse(false);
            boolean isPinned = optSetting.map(ChatRoomUserSetting::getIsPinned).orElse(false);
            boolean isArchived = optSetting.map(ChatRoomUserSetting::getIsArchived).orElse(false);
            LocalDateTime lastReadAt = optSetting.map(ChatRoomUserSetting::getLastReadAt).orElse(null);

            // Compute unread message count
            List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(r.getId());
            long unreadCount = messages.stream()
                    .filter(msg -> !msg.getSenderId().equals(actor.getId()))
                    .filter(msg -> lastReadAt == null || msg.getCreatedAt().isAfter(lastReadAt))
                    .count();

            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("name", r.getName());
            m.put("isGroup", r.getIsGroup());
            m.put("memberUserIds", r.getMemberUserIds());
            m.put("isMuted", isMuted);
            m.put("isPinned", isPinned);
            m.put("isArchived", isArchived);
            m.put("unreadCount", unreadCount);
            
            // Get recent message preview
            if (!messages.isEmpty()) {
                ChatMessage latest = messages.get(messages.size() - 1);
                m.put("latestMessage", latest.getMessage());
                m.put("latestMessageTime", latest.getCreatedAt());
            }

            // For 1-on-1 DM rooms, display the other user's name as the chat room name
            if (!r.getIsGroup() && r.getMemberUserIds().size() == 2) {
                Long otherId = r.getMemberUserIds().stream()
                        .filter(id -> !id.equals(actor.getId()))
                        .findFirst().orElse(null);
                if (otherId != null) {
                    userRepository.findById(otherId).ifPresent(otherUser -> {
                        String name = (otherUser.getFirstName() != null ? otherUser.getFirstName() : "") + 
                                      (otherUser.getLastName() != null ? " " + otherUser.getLastName() : "");
                        if (name.trim().isEmpty()) {
                            name = otherUser.getUsername();
                        }
                        m.put("name", name);
                    });
                }
            }
            res.add(m);
        }
        return res;
    }

    @PostMapping("/rooms")
    public ChatRoom createRoom(@RequestBody Map<String, Object> request, Authentication authentication) {
        User actor = getActor(authentication);
        ChatRoom room = new ChatRoom();
        room.setName((String) request.get("name"));
        room.setIsGroup(Boolean.TRUE.equals(request.get("isGroup")));
        
        Set<Long> members = new HashSet<>();
        members.add(actor.getId());
        
        List<?> reqMembers = (List<?>) request.get("memberUserIds");
        if (reqMembers != null) {
            for (Object m : reqMembers) {
                if (m instanceof Number) {
                    members.add(((Number) m).longValue());
                }
            }
        }
        
        // Check if a 1-on-1 DM room already exists between these two users
        if (!room.getIsGroup() && members.size() == 2) {
            List<ChatRoom> existing = chatRoomRepository.findRoomsByMemberUserId(actor.getId());
            for (ChatRoom r : existing) {
                if (!r.getIsGroup() && r.getMemberUserIds().equals(members)) {
                    return r;
                }
            }
        }
        
        room.setMemberUserIds(members);
        return chatRoomRepository.save(room);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public List<ChatMessage> getMessages(@PathVariable("roomId") Long roomId, Authentication authentication) {
        User actor = getActor(authentication);
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        if (!room.getMemberUserIds().contains(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        // Automatically update last read status
        ChatRoomUserSetting setting = chatRoomUserSettingRepository
                .findByChatRoomIdAndUserId(roomId, actor.getId())
                .orElseGet(() -> {
                    ChatRoomUserSetting s = new ChatRoomUserSetting();
                    s.setChatRoomId(roomId);
                    s.setUserId(actor.getId());
                    return s;
                });
        setting.setLastReadAt(LocalDateTime.now());
        chatRoomUserSettingRepository.save(setting);

        return chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(roomId);
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ChatMessage sendMessage(@PathVariable("roomId") Long roomId, @RequestBody ChatMessage request, Authentication authentication) {
        User actor = getActor(authentication);
        ChatRoom room = chatRoomRepository.findRoomsByMemberUserId(actor.getId()).stream()
                .filter(r -> r.getId().equals(roomId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        
        ChatMessage msg = new ChatMessage();
        msg.setChatRoomId(roomId);
        msg.setSenderId(actor.getId());
        msg.setMessage(request.getMessage());
        ChatMessage saved = chatMessageRepository.save(msg);

        // Update read status for sender
        ChatRoomUserSetting setting = chatRoomUserSettingRepository
                .findByChatRoomIdAndUserId(roomId, actor.getId())
                .orElseGet(() -> {
                    ChatRoomUserSetting s = new ChatRoomUserSetting();
                    s.setChatRoomId(roomId);
                    s.setUserId(actor.getId());
                    return s;
                });
        setting.setLastReadAt(LocalDateTime.now());
        chatRoomUserSettingRepository.save(setting);

        return saved;
    }

    // Toggle Pinned status
    @PostMapping("/rooms/{roomId}/pin")
    public Map<String, Object> togglePin(@PathVariable("roomId") Long roomId, Authentication authentication) {
        User actor = getActor(authentication);
        ChatRoomUserSetting setting = chatRoomUserSettingRepository
                .findByChatRoomIdAndUserId(roomId, actor.getId())
                .orElseGet(() -> {
                    ChatRoomUserSetting s = new ChatRoomUserSetting();
                    s.setChatRoomId(roomId);
                    s.setUserId(actor.getId());
                    return s;
                });
        setting.setIsPinned(!setting.getIsPinned());
        chatRoomUserSettingRepository.save(setting);
        return Map.of("isPinned", setting.getIsPinned());
    }

    // Toggle Muted status
    @PostMapping("/rooms/{roomId}/mute")
    public Map<String, Object> toggleMute(@PathVariable("roomId") Long roomId, Authentication authentication) {
        User actor = getActor(authentication);
        ChatRoomUserSetting setting = chatRoomUserSettingRepository
                .findByChatRoomIdAndUserId(roomId, actor.getId())
                .orElseGet(() -> {
                    ChatRoomUserSetting s = new ChatRoomUserSetting();
                    s.setChatRoomId(roomId);
                    s.setUserId(actor.getId());
                    return s;
                });
        setting.setIsMuted(!setting.getIsMuted());
        chatRoomUserSettingRepository.save(setting);
        return Map.of("isMuted", setting.getIsMuted());
    }

    // Toggle Archived status
    @PostMapping("/rooms/{roomId}/archive")
    public Map<String, Object> toggleArchive(@PathVariable("roomId") Long roomId, Authentication authentication) {
        User actor = getActor(authentication);
        ChatRoomUserSetting setting = chatRoomUserSettingRepository
                .findByChatRoomIdAndUserId(roomId, actor.getId())
                .orElseGet(() -> {
                    ChatRoomUserSetting s = new ChatRoomUserSetting();
                    s.setChatRoomId(roomId);
                    s.setUserId(actor.getId());
                    return s;
                });
        setting.setIsArchived(!setting.getIsArchived());
        chatRoomUserSettingRepository.save(setting);
        return Map.of("isArchived", setting.getIsArchived());
    }

    // Mark Chat as Read
    @PostMapping("/rooms/{roomId}/read")
    public void markAsRead(@PathVariable("roomId") Long roomId, Authentication authentication) {
        User actor = getActor(authentication);
        ChatRoomUserSetting setting = chatRoomUserSettingRepository
                .findByChatRoomIdAndUserId(roomId, actor.getId())
                .orElseGet(() -> {
                    ChatRoomUserSetting s = new ChatRoomUserSetting();
                    s.setChatRoomId(roomId);
                    s.setUserId(actor.getId());
                    return s;
                });
        setting.setLastReadAt(LocalDateTime.now());
        chatRoomUserSettingRepository.save(setting);
    }

    // Block User
    @PostMapping("/users/{userId}/block")
    public void blockUser(@PathVariable("userId") Long userId, Authentication authentication) {
        User actor = getActor(authentication);
        Optional<UserBlock> blockOpt = userBlockRepository.findByUserIdAndBlockedUserId(actor.getId(), userId);
        if (blockOpt.isEmpty()) {
            UserBlock block = new UserBlock();
            block.setUserId(actor.getId());
            block.setBlockedUserId(userId);
            userBlockRepository.save(block);
        }
    }

    // Unblock User
    @PostMapping("/users/{userId}/unblock")
    public void unblockUser(@PathVariable("userId") Long userId, Authentication authentication) {
        User actor = getActor(authentication);
        userBlockRepository.findByUserIdAndBlockedUserId(actor.getId(), userId)
                .ifPresent(userBlockRepository::delete);
    }
}
