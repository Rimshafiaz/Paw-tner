import { useState, useRef } from 'react'

function PhotoSelector({ onPhotoSelected, onError }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
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
      onPhotoSelected?.(file)
      
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

  const removePhoto = () => {
    setSelectedFile(null)
    setPreview(null)
    onPhotoSelected?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Pet Photo (Optional)
      </div>
      
      {preview ? (
        <div className="relative">
          <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
            <img 
              src={preview}
              alt="Pet preview"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              📷 Photo selected: {selectedFile?.name}
            </div>
            <button
              type="button"
              onClick={removePhoto}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Remove
            </button>
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            Photo will be uploaded when you create the pet
          </div>
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

export default PhotoSelector