import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Pagination,
  Chip,
} from "@mui/material";
import { Lock, Unlock, Search, Eye } from "lucide-react";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getUsers(page, limit, search, roleFilter);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      await adminApi.suspendUser(userId);
      fetchUsers();
    } catch (error) {
      console.error("Failed to suspend user:", error);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await adminApi.activateUser(userId);
      fetchUsers();
    } catch (error) {
      console.error("Failed to activate user:", error);
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-cyan-400/12 text-cyan-200";
      case "teacher":
        return "bg-orange-400/12 text-orange-200";
      case "student":
      default:
        return "bg-emerald-400/12 text-emerald-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-400/12 text-emerald-200";
      case "suspended":
        return "bg-red-400/12 text-red-200";
      case "pending":
        return "bg-yellow-400/12 text-yellow-200";
      default:
        return "bg-white/10 text-white/70";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div>
          <h1 className="text-4xl font-bold">User Management</h1>
          <p className="mt-2 text-white/60">Search, view, and manage platform users</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] ${glass} p-6`}>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            variant="outlined"
            size="small"
            startAdornment={<Search size={18} className="mr-2" />}
            InputProps={{ className: "!text-white" }}
            InputLabelProps={{ className: "!text-white/70" }}
          />

          <FormControl size="small">
            <InputLabel className="!text-white/70">Filter by Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              label="Filter by Role"
              className="!text-white"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="!text-white/70">Name</TableCell>
                <TableCell className="!text-white/70">Email</TableCell>
                <TableCell className="!text-white/70">Role</TableCell>
                <TableCell className="!text-white/70">Status</TableCell>
                <TableCell className="!text-white/70">Joined</TableCell>
                <TableCell className="!text-white/70">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell className="!text-white font-medium">{user.name}</TableCell>
                    <TableCell className="!text-white/70 text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.role} size="small" className={`!font-semibold ${getRoleColor(user.role)}`} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.accountStatus || "active"}
                        size="small"
                        className={`!font-semibold ${getStatusColor(user.accountStatus)}`}
                      />
                    </TableCell>
                    <TableCell className="!text-white/70 text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        title="View profile"
                      >
                        <Eye size={18} />
                      </IconButton>
                      {user.accountStatus === "active" ? (
                        <IconButton
                          size="small"
                          onClick={() => handleSuspendUser(user._id)}
                          title="Suspend user"
                        >
                          <Lock size={18} />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleActivateUser(user._id)}
                          title="Activate user"
                        >
                          <Unlock size={18} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="!py-8 !text-white/50">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              count={pagination.pages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserManagement;
