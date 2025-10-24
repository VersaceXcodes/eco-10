const user = useAppStore(state => state.authentication_state.current_user);
if (!user || user.user_type!== 'business') {
  return <Navigate to="/dashboard" replace />;
}