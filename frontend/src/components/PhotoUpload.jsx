import { useState, useRef } from 'react'
import API_URL from '../config/api'

function PhotoUpload({ petId, currentPhotoUrl, onPhotoUploaded, onError }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(currentPhotoUrl || null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPG, PNG, or GIF)'
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }
    
    return null
  }

  const handleFiles = (files) => {
    if (files && files[0]) {
      const file = files[0]
      const error = validateFile(file)
      
      if (error) {
        onError?.(error)
        return
      }
      
      setSelectedFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    handleFiles(files)
  }

  const uploadPhoto = async () => {
    if (!selectedFile || !petId || uploading) return

    setUploading(true)
    setUploadProgress(0)
    
    const formData = new FormData()
    formData.append('file', selectedFile)
    
    try {
      const token = localStorage.getItem('auth_token')
      
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          setUploading(false)
          
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            setPreview(response.photo_url)
            onPhotoUploaded?.(response.photo_url)
            setSelectedFile(null)
            setUploadProgress(0)
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              onError?.(errorResponse.detail || 'Upload failed')
            } catch {
              onError?.('Upload failed. Please try again.')
            }
            setUploadProgress(0)
          }
        }
      }
      
      xhr.open('POST', `${API_URL}/pets/${petId}/upload-photo`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
      
    } catch (error) {
      setUploading(false)
      setUploadProgress(0)
      onError?.('Network error. Please check your connection and try again.')
    }
  }

  const removePhoto = () => {
    setSelectedFile(null)
    setPreview(currentPhotoUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const deletePhoto = async () => {
    if (!petId || uploading) return

    setUploading(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch(`${API_URL}/pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          primary_photo_url: null
        })
      })
      
      if (response.ok) {
        setPreview(null)
        setSelectedFile(null)
        onPhotoUploaded?.(null)
        onError?.('Photo deleted successfully')
      } else {
        const errorResponse = await response.json()
        onError?.(errorResponse.detail || 'Failed to delete photo')
      }
    } catch (error) {
      onError?.('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Pet Photo
      </div>
      
      {preview ? (
        <div className="relative">
          <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
            <img 
              src={preview.startsWith('/uploads') ? `${API_URL}${preview}` : preview}
              alt="Pet preview"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="mt-4 flex gap-3">
            {selectedFile && !uploading && (
              <button
                onClick={uploadPhoto}
                className="flex-1 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                Upload Photo
              </button>
            )}
            
            {!uploading && (
              <>
                {selectedFile ? (
                  <button
                    onClick={removePhoto}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  currentPhotoUrl && (
                    <button
                      onClick={deletePhoto}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Delete Photo
                    </button>
                  )
                )}
              </>
            )}
          </div>
          
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive 
              ? 'border-secondary bg-secondary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div>
              <p className="text-gray-600 mb-2">
                Drag and drop a photo here, or{' '}
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="text-secondary hover:text-secondary/80 font-medium underline"
                >
                  browse to choose a file
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, and GIF files up to 5MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload