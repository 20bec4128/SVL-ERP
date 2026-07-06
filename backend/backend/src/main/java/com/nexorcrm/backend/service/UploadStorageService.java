package com.nexorcrm.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class UploadStorageService {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public String storeEmployeePublicFormUpload(Long employeeId, String kind, MultipartFile file) {
        try {
            Path dir = Path.of(uploadDir, "employees", String.valueOf(employeeId), "public-form", kind)
                    .toAbsolutePath()
                    .normalize();
            Files.createDirectories(dir);
            String originalName = file.getOriginalFilename();
            String safeName = originalName == null ? "file" : Path.of(originalName).getFileName().toString();
            String storedName = UUID.randomUUID() + "_" + safeName;
            Path target = dir.resolve(storedName).normalize();
            if (!target.startsWith(dir)) {
                throw new IllegalStateException("Invalid upload path");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return Path.of("uploads", "employees", String.valueOf(employeeId), "public-form", kind, storedName)
                    .toString()
                    .replace("\\", "/");
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload employee document", ex);
        }
    }
}

