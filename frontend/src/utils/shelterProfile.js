export const isShelterProfileComplete = (shelter) => {
  if (!shelter) return false
  
  const requiredFields = [
    'name',
    'email', 
    'phone',
    'contact_hours',
    'city',
    'state'
  ]
  
  return requiredFields.every(field => 
    shelter[field] && shelter[field].toString().trim() !== ''
  )
}

export const getMissingRequiredFields = (shelter) => {
  if (!shelter) return ['All profile information']
  
  const requiredFields = {
    'name': 'Shelter name',
    'email': 'Email address', 
    'phone': 'Phone number',
    'contact_hours': 'Contact hours',
    'city': 'City',
    'state': 'State'
  }
  
  return Object.entries(requiredFields)
    .filter(([field]) => !shelter[field] || shelter[field].toString().trim() === '')
    .map(([, label]) => label)
}