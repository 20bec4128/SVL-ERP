package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.entity.UserFile;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserFileRepository;
import com.nexorcrm.backend.repo.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
public class FileManagerController {

    private final UserFileRepository userFileRepository;
    private final UserRepository userRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public FileManagerController(UserFileRepository userFileRepository, UserRepository userRepository) {
        this.userFileRepository = userFileRepository;
        this.userRepository = userRepository;
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

    @GetMapping
    public List<UserFile> list(
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam(value = "search", required = false) String search,
            Authentication authentication) {
        User actor = getActor(authentication);
        if (search != null && !search.trim().isEmpty()) {
            return userFileRepository.findByUserIdAndNameContainingIgnoreCase(actor.getId(), search.trim());
        }
        if (parentId != null) {
            return userFileRepository.findByUserIdAndParentId(actor.getId(), parentId);
        }
        return userFileRepository.findByUserIdAndParentIdIsNull(actor.getId());
    }

    @PostMapping
    public UserFile create(@RequestBody UserFile request, Authentication authentication) {
        User actor = getActor(authentication);
        UserFile file = new UserFile();
        file.setName(request.getName());
        file.setSize(request.getSize());
        file.setType(request.getType());
        file.setIsDirectory(request.getIsDirectory() != null && request.getIsDirectory());
        file.setParentId(request.getParentId());
        file.setPath(request.getPath());
        file.setUserId(actor.getId());
        return userFileRepository.save(file);
    }

    @PostMapping("/upload")
    public UserFile uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "parentId", required = false) Long parentId,
            Authentication authentication) throws IOException {
        User actor = getActor(authentication);
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        Path dir = Path.of(uploadDir, "file-manager").toAbsolutePath().normalize();
        Files.createDirectories(dir);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "unnamed_file";
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < originalFilename.length() - 1) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        String uniqueSuffix = UUID.randomUUID().toString().replace("-", "");
        String storedName = uniqueSuffix + "_" + originalFilename;
        Path target = dir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String relativePath = "/uploads/file-manager/" + storedName;

        UserFile userFile = new UserFile();
        userFile.setName(originalFilename);
        userFile.setSize(file.getSize());
        userFile.setType(extension);
        userFile.setIsDirectory(false);
        userFile.setParentId(parentId);
        userFile.setPath(relativePath);
        userFile.setUserId(actor.getId());

        return userFileRepository.save(userFile);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id, Authentication authentication) {
        User actor = getActor(authentication);
        UserFile file = userFileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        if (!file.getUserId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (!file.getIsDirectory() && file.getPath() != null) {
            try {
                String pathStr = file.getPath();
                if (pathStr.startsWith("/uploads/")) {
                    String subPath = pathStr.substring("/uploads/".length());
                    Path physicalPath = Path.of(uploadDir, subPath).toAbsolutePath().normalize();
                    Files.deleteIfExists(physicalPath);
                }
            } catch (IOException ignored) {
            }
        }

        userFileRepository.delete(file);
    }
}
