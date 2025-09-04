import validator from 'validator'

export const levenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1]
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

export const validateEmail = (email) => {
  if (!email) {
    return { isValid: true, message: '' }
  }

  if (!validator.isEmail(email)) {
    return { isValid: false, message: 'Please enter a valid email address' }
  }

  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com']
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (domain && !commonDomains.includes(domain)) {
    let bestMatch = null
    let minDistance = Infinity
    
    commonDomains.forEach(commonDomain => {
      const distance = levenshteinDistance(domain, commonDomain)
      if (distance <= 2 && distance < minDistance) {
        minDistance = distance
        bestMatch = commonDomain
      }
    })
    
    if (bestMatch && minDistance <= 2) {
      return { 
        isValid: false, 
        message: `Did you mean ${email.split('@')[0]}@${bestMatch}?` 
      }
    }
  }

  return { isValid: true, message: '' }
}