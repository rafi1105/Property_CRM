<?php
/**
 * Simple Image Upload Script for Hostinger
 * Place this in: public_html/api/upload.php
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration
$uploadDir = dirname(__FILE__) . '/../uploads/properties/';
$allowedTypes = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp');
$maxFileSize = 10 * 1024 * 1024; // 10MB
$maxFiles = 10;

// Get the base URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'];

// Create upload directory if it doesn't exist
if (!file_exists($uploadDir)) {
    if (!@mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(array(
            'success' => false,
            'message' => 'Failed to create upload directory',
            'path' => $uploadDir
        ));
        exit();
    }
}

// Check if directory is writable
if (!is_writable($uploadDir)) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'message' => 'Upload directory is not writable. Set permissions to 755.',
        'path' => $uploadDir
    ));
    exit();
}

// Handle POST - Upload images
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Check if files were uploaded
    if (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'message' => 'No files uploaded',
            'debug' => array(
                'files' => isset($_FILES) ? array_keys($_FILES) : 'none',
                'post' => isset($_POST) ? array_keys($_POST) : 'none'
            )
        ));
        exit();
    }

    $uploadedImages = array();
    $errors = array();
    $files = $_FILES['images'];
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;

    if ($fileCount > $maxFiles) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'message' => 'Maximum ' . $maxFiles . ' files allowed at once'
        ));
        exit();
    }

    // Handle both single and multiple file uploads
    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $fileType = is_array($files['type']) ? $files['type'][$i] : $files['type'];
        $fileSize = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $fileTmp = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $fileError = is_array($files['error']) ? $files['error'][$i] : $files['error'];

        // Check for upload errors
        if ($fileError !== UPLOAD_ERR_OK) {
            $errors[] = 'Upload error for ' . $fileName . ': code ' . $fileError;
            continue;
        }

        // Validate file type
        if (!in_array($fileType, $allowedTypes)) {
            $errors[] = 'Invalid file type for ' . $fileName . ': ' . $fileType;
            continue;
        }

        // Validate file size
        if ($fileSize > $maxFileSize) {
            $errors[] = 'File too large: ' . $fileName;
            continue;
        }

        // Generate unique filename
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $uniqueName = 'property-' . time() . '-' . mt_rand(1000000000, 9999999999) . '.' . $extension;
        $targetPath = $uploadDir . $uniqueName;

        // Move uploaded file
        if (move_uploaded_file($fileTmp, $targetPath)) {
            $imageUrl = $baseUrl . '/uploads/properties/' . $uniqueName;
            $uploadedImages[] = $imageUrl;
        } else {
            $errors[] = 'Failed to move file: ' . $fileName;
        }
    }

    if (count($uploadedImages) > 0) {
        $filesData = array();
        foreach ($uploadedImages as $url) {
            $filesData[] = array(
                'url' => $url,
                'filename' => basename($url)
            );
        }
        
        echo json_encode(array(
            'success' => true,
            'message' => count($uploadedImages) . ' image(s) uploaded successfully',
            'images' => $uploadedImages,
            'files' => $filesData
        ));
    } else {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'message' => 'No valid images were uploaded',
            'errors' => $errors
        ));
    }
    exit();
}

// Handle GET - List all images
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $images = array();
    
    if (is_dir($uploadDir)) {
        $files = scandir($uploadDir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && $file !== '.gitkeep') {
                $images[] = array(
                    'filename' => $file,
                    'url' => $baseUrl . '/uploads/properties/' . $file
                );
            }
        }
    }

    echo json_encode(array(
        'success' => true,
        'images' => $images,
        'count' => count($images)
    ));
    exit();
}

// Handle DELETE - Delete an image
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Get filename from URL
    $requestUri = $_SERVER['REQUEST_URI'];
    $parts = explode('/', $requestUri);
    $filename = end($parts);

    // Remove query string if present
    if (strpos($filename, '?') !== false) {
        $filename = substr($filename, 0, strpos($filename, '?'));
    }

    if (empty($filename) || $filename === 'upload.php') {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'message' => 'Filename required'
        ));
        exit();
    }

    $filePath = $uploadDir . basename($filename);

    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            echo json_encode(array(
                'success' => true,
                'message' => 'Image deleted successfully'
            ));
        } else {
            http_response_code(500);
            echo json_encode(array(
                'success' => false,
                'message' => 'Failed to delete image'
            ));
        }
    } else {
        http_response_code(404);
        echo json_encode(array(
            'success' => false,
            'message' => 'Image not found'
        ));
    }
    exit();
}

// Default response
http_response_code(405);
echo json_encode(array(
    'success' => false,
    'message' => 'Method not allowed'
));
?>
