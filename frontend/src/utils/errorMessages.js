export function getUserFriendlyError(errorData, defaultMessage = 'Something went wrong. Please try again.') {
  console.error('Error details:', errorData)
  
  if (!errorData) {
    return defaultMessage
  }
  
  if (Array.isArray(errorData.detail)) {
    const messages = errorData.detail.map(err => {
      const field = err.loc?.[err.loc.length - 1] || 'field'
      const msg = err.msg || ''
      
      const fieldLabels = {
        'email': 'Email address',
        'password': 'Password',
        'username': 'Username',
        'full_name': 'Full name',
        'phone': 'Phone number',
        'city': 'City',
        'state': 'State',
        'zip_code': 'Postal code',
        'country': 'Country',
        'name': 'Name',
        'address': 'Address'
      }
      
      const friendlyField = fieldLabels[field] || field
      
      if (msg.includes('field required')) {
        return `${friendlyField} is required`
      }
      if (msg.includes('string does not match')) {
        return `${friendlyField} format is invalid`
      }
      if (msg.includes('value is not a valid')) {
        return `Please enter a valid ${friendlyField.toLowerCase()}`
      }
      if (msg.includes('ensure this value has at least')) {
        return `${friendlyField} is too short`
      }
      if (msg.includes('ensure this value has at most')) {
        return `${friendlyField} is too long`
      }
      
      return `${friendlyField}: ${msg}`
    })
    
    return messages.join('. ')
  }
  
  if (typeof errorData.detail === 'string') {
    const detail = errorData.detail.toLowerCase()
    
    if (detail.includes('already exists') || detail.includes('already registered')) {
      return 'An account with this email already exists. Please try logging in instead.'
    }
    if (detail.includes('email')) {
      return 'Please enter a valid email address.'
    }
    if (detail.includes('password')) {
      return 'Password must be at least 8 characters long.'
    }
    if (detail.includes('invalid') && detail.includes('credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }
    if (detail.includes('not found')) {
      return 'Account not found. Please check your email address.'
    }
    if (detail.includes('unauthorized') || detail.includes('not authenticated')) {
      return 'Please log in to continue.'
    }
    if (detail.includes('forbidden') || detail.includes('permission')) {
      return "You don't have permission to perform this action."
    }
    if (detail.includes('timeout') || detail.includes('timed out')) {
      return 'The request took too long. Please check your connection and try again.'
    }
    if (detail.includes('database constraint') || detail.includes('constraint')) {
      return 'The information you entered conflicts with existing data. Please check and try again.'
    }
    if (detail.includes('an error occurred')) {
      return 'Something went wrong. Please try again in a moment.'
    }
    
    return errorData.detail
  }
  
  if (errorData.message) {
    return getUserFriendlyError({ detail: errorData.message }, defaultMessage)
  }
  
  return defaultMessage
}

export function getNetworkError(error) {
  if (error.name === 'AbortError') {
    return 'The request took too long. Please check your connection and try again.'
  }
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }
  return 'Connection failed. Please check your internet and try again.'
}

