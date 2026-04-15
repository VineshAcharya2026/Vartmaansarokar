export const getToken = () => 
  localStorage.getItem('token') || ''

export const getUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem('user') || 'null'
    )
  } catch { return null }
}

export const setAuth = (token: string, user: any) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const authHeaders = () => {
  const token = getToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
}

export const uploadHeaders = () => {
  const token = getToken();
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
}

export const isLoggedIn = () => !!getToken()

export const getUserRole = () => 
  getUser()?.role || 'READER'
