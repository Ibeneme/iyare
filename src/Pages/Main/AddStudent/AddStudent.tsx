// src/pages/AddStudent.tsx
import React, { useState, useEffect, useMemo, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Loader2,
  CheckCircle,
  X,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "axios";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { BASE_URL } from "../../../Redux/baseurl";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchUser } from "../../../Redux/Slices/accounts.slice";
import toast from "react-hot-toast";
import { AppDispatch } from "../../../Redux/store";

const API_BASE = `${BASE_URL}/api/users`;
const GRADES_API = `${BASE_URL}/api/grades/grades`;

/* ────── REUSABLE INPUT WITH ICON (forwardRef) ────── */
const InputWithIcon = forwardRef<
  HTMLInputElement,
  {
    icon: React.ElementType;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    disabled?: boolean;
    showToggle?: boolean;
    show?: boolean;
    toggleShow?: () => void;
    className?: string;
  }
>(
  (
    {
      icon: Icon,
      placeholder,
      value,
      onChange,
      type = "text",
      disabled = false,
      showToggle,
      show,
      toggleShow,
      className = "",
    },
    ref
  ) => (
    <div className="relative">
      <div className="absolute left-3 top-[38%] -translate-y-[38%] text-[#023009]/60 pointer-events-none">
        <Icon className="w-5 h-5" />
      </div>
      <input
        ref={ref}
        type={showToggle && show ? "text" : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
          disabled
            ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
            : "border-[#ffd000]/50 focus:border-[#023009]"
        } ${showToggle ? "pr-12" : ""} ${className}`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-[28%] -translate-y-[28%] text-[#023009]/60"
          disabled={disabled}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  )
);
InputWithIcon.displayName = "InputWithIcon";

/* ────── INTERFACES ────── */
interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}
interface Grade {
  _id: string;
  title: string;
}
interface Subject {
  _id: string;
  name: string;
  code: string;
}
interface ChildForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  class: string;
  subjects: string[];
}
interface ExistingStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  class: string;
  subjects: string[];
}

/* ────── MAIN COMPONENT ────── */
const AddStudent: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  /* Refs */
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const customClassRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  /* State */
  const [parent, setParent] = useState<Parent | null>(null);
  const [loadingParent, setLoadingParent] = useState(true);

  const [child, setChild] = useState<ChildForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    class: "",
    subjects: [],
  });

  const [existingStudents, setExistingStudents] = useState<ExistingStudent[]>(
    []
  );
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectsByGrade, setSubjectsByGrade] = useState<
    Record<string, Subject[]>
  >({});
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  /* ────── LOAD PARENT ────── */
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.email && parsed._id) {
          setParent({
            _id: parsed._id,
            firstName: parsed.firstName || "",
            lastName: parsed.lastName || "",
            email: parsed.email,
          });
        }
      } catch (e) {
        console.error("Failed to parse user");
      }
    }
    setLoadingParent(false);
  }, []);

  /* ────── FETCH EXISTING STUDENTS ────── */
  useEffect(() => {
    if (!parent) return;

    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const res: any = await dispatch(fetchUser()).unwrap();
        if (res.success && res.data?.[0]) {
          const students = res.data.filter(
            (u: any) => u.userType === "student"
          );
          setExistingStudents(students);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load students");
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [parent, dispatch]);

  /* ────── FETCH GRADES ────── */
  useEffect(() => {
    if (!parent) return;
    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const { data } = await axios.get(GRADES_API);
        setGrades(data.data || data || []);
      } catch (e) {
        console.error("Failed to load classes");
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [parent]);

  /* ────── FETCH SUBJECTS ────── */
  const fetchSubjects = async (gradeId: string) => {
    if (subjectsByGrade[gradeId]) return;
    setLoadingSubjects(true);
    try {
      const { data } = await axios.get(`${GRADES_API}/subjects/${gradeId}`);
      setSubjectsByGrade((p) => ({ ...p, [gradeId]: data.data || [] }));
    } catch (e) {
      console.error("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };
  useEffect(() => {
    if (child.class && !child.class.startsWith("custom")) {
      fetchSubjects(child.class);
    }
  }, [child.class]);

  /* ────── RESEND TIMER ────── */
  useEffect(() => {
    if (resendTimer > 0) {
      const id = setInterval(() => {
        setResendTimer((t) => (t <= 1 ? 0 : t - 1));
      }, 1000);
      return () => clearInterval(id);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  /* ────── HANDLERS ────── */
  const updateChild = (field: keyof ChildForm, value: any) => {
    if (field === "class" && value !== child.class) {
      setChild((c) => ({ ...c, [field]: value, subjects: [] }));
    } else {
      setChild((c) => ({ ...c, [field]: value }));
    }
  };

  const addSubject = (id: string) => {
    if (!child.subjects.includes(id)) {
      updateChild("subjects", [...child.subjects, id]);
      setSearchQuery("");
    }
  };
  const removeSubject = (id: string) => {
    updateChild(
      "subjects",
      child.subjects.filter((s) => s !== id)
    );
  };

  const isFormValid =
    child.firstName &&
    child.lastName &&
    child.email &&
    child.phone &&
    isValidPhoneNumber(child.phone) &&
    child.class &&
    child.subjects.length > 0;

  /* ────── OTP ACTIONS ────── */
  const sendOtp = async () => {
    if (!parent || !isFormValid) return;
    setOtpLoading(true);
    setOtpMessage("");
    try {
      await axios.post(`${API_BASE}/register-parent`, { email: parent.email });
      setOtpMessage("OTP sent to your email!");
      setShowOtpModal(true);
      setResendTimer(60);
      setCanResend(false);
      setOtp("");
    } catch (e: any) {
      setOtpMessage(e.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend || otpLoading || !parent) return;
    setOtpLoading(true);
    try {
      await axios.post(`${API_BASE}/register-parent`, { email: parent.email });
      setOtpMessage("OTP resent!");
      setResendTimer(60);
      setCanResend(false);
    } catch (e: any) {
      setOtpMessage(e.response?.data?.message || "Failed to resend");
    } finally {
      setOtpLoading(false);
    }
  };

  const submitWithOtp = async () => {
    const clean = otp.replace(/\D/g, "").slice(0, 6);
    if (!parent || clean.length !== 6) return;

    setOtpLoading(true);
    setOtpMessage("");
    try {
      // Combine existing + new student
      const allStudents = [
        ...existingStudents.map((s) => ({
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: s.phone,
          gradeId: s.class,
          subjects: s.subjects,
        })),
        {
          firstName: child.firstName,
          lastName: child.lastName,
          email: child.email,
          phone: child.phone,
          gradeId: child.class,
          subjects: child.subjects,
        },
      ];

      console.log(allStudents, 'allStudents')
      await axios.post(`${API_BASE}/register-students-array`, {
        email: parent.email,
        otp: clean,
        students: allStudents,
      });

      setResultSuccess(true);
      setResultMessage(`Student "${child.firstName}" added successfully!`);
      setShowResultModal(true);
      setShowOtpModal(false);

      // Reset form
      setChild({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        class: "",
        subjects: [],
      });
    } catch (e: any) {
      setOtpMessage(e.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ────── SUBJECTS LOGIC ────── */
  const gradeSubjects = child.class ? subjectsByGrade[child.class] || [] : [];
  const availableSubjects = gradeSubjects.filter(
    (s) => !child.subjects.includes(s._id)
  );
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return availableSubjects;
    const q = searchQuery.toLowerCase();
    return availableSubjects.filter((s) =>
      `${s.name} ${s.code}`.toLowerCase().includes(q)
    );
  }, [availableSubjects, searchQuery]);

  /* ────── REUSABLE SELECT ────── */
  const LabeledSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    loading = false,
    required = false,
    selectRef,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    loading?: boolean;
    required?: boolean;
    selectRef?: React.RefObject<HTMLSelectElement>;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-[#023009] flex items-center gap-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <div className="relative">
        <select
          ref={selectRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className={`
            w-full appearance-none
            px-4 py-3
            text-base
            rounded-xl
            border-2
            border-[#ffd000]/50
            focus:border-[#023009]
            focus:outline-none
            focus:ring-4
            focus:ring-[#ffd000]/20
            transition-all
            duration-200
            bg-white
            text-[#023009]
            disabled:bg-gray-50
            disabled:text-gray-500
            pr-12
          `}
        >
          <option value="">
            {loading ? "Loading..." : placeholder || "Select..."}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#023009]/50 pointer-events-none" />
      </div>
    </div>
  );

  /* ────── RENDER ────── */
  if (loadingParent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#023009]" />
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-xl text-center">
          <X className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#023009]">Access Denied</h2>
          <p className="text-[#023009]/70 mt-2">Please log in first.</p>
          <button
            onClick={() => navigate("/auth-sign-in")}
            className="mt-6 px-6 py-3 bg-[#023009] text-white rounded-xl font-bold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5fdf5] to-[#e6f7e6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-8 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="text-[#023009]/70 hover:text-[#023009]"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-center flex-1">
              <div className="w-16 h-16 bg-[#ffd000] rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-9 h-9 text-[#023009]" />
              </div>
              <h1 className="text-2xl font-black text-[#023009]">
                Add New Student
              </h1>
              <p className="text-sm text-[#023009]/70">
                For parent: <strong>{parent.email}</strong>
              </p>
            </div>
            <div className="w-6" />
          </div>

          {/* Existing Students */}
          {loadingStudents ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#023009]" />
            </div>
          ) : existingStudents.length > 0 ? (
            <div className="mb-6 p-4 bg-[#f0fdf0] rounded-xl border border-[#ffd000]/30">
              <p className="font-bold text-[#023009] mb-2">
                Already Added Students ({existingStudents.length})
              </p>
              <div className="space-y-2">
                {existingStudents.map((s) => (
                  <div
                    key={s._id}
                    className="flex justify-between items-center p-2 bg-white rounded-lg border"
                  >
                    <span className="text-sm font-medium">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="text-xs text-[#023009]/60">{s.email}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Form */}
          <div className="space-y-6">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#023009] flex items-center gap-1">
                  First Name <span className="text-red-600">*</span>
                </label>
                <InputWithIcon
                  icon={User}
                  placeholder="Enter first name"
                  value={child.firstName}
                  onChange={(e) => updateChild("firstName", e.target.value)}
                  ref={firstNameRef}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#023009] flex items-center gap-1">
                  Last Name <span className="text-red-600">*</span>
                </label>
                <InputWithIcon
                  icon={User}
                  placeholder="Enter last name"
                  value={child.lastName}
                  onChange={(e) => updateChild("lastName", e.target.value)}
                  ref={lastNameRef}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#023009] flex items-center gap-1">
                Email <span className="text-red-600">*</span>
              </label>
              <InputWithIcon
                icon={Mail}
                placeholder="Enter email address"
                type="email"
                value={child.email}
                onChange={(e) => updateChild("email", e.target.value)}
                ref={emailRef}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#023009] flex items-center gap-1">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#023009]/60 z-10 pointer-events-none">
                  <Phone className="w-5 h-5" />
                </div>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="NG"
                  value={child.phone}
                  onChange={(v) => updateChild("phone", v || "")}
                  placeholder="Enter phone number"
                  className="phone-input"
                  style={{
                    paddingLeft: "3.5rem",
                    paddingTop: "0.75rem",
                    paddingBottom: "0.75rem",
                    paddingRight: "1rem",
                    fontSize: "1rem",
                    borderRadius: "0.75rem",
                    border: "2px solid rgba(255, 208, 0, 0.5)",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#023009";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(255, 208, 0, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 208, 0, 0.5)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {child.phone && !isValidPhoneNumber(child.phone) && (
                <p className="text-red-600 text-xs mt-1">
                  Invalid phone number
                </p>
              )}
            </div>

            {/* Class */}
            <LabeledSelect
              label="Class"
              value={child.class}
              onChange={(v) => updateChild("class", v)}
              options={[
                ...grades.map((g) => ({ value: g._id, label: g.title })),
                { value: "custom", label: "Custom..." },
              ]}
              placeholder="Choose class..."
              loading={loadingGrades}
              required
            />

            {/* Custom Class */}
            {child.class === "custom" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="block text-sm font-bold text-[#023009]">
                  Custom Class Name
                </label>
                <InputWithIcon
                  icon={User}
                  placeholder="e.g. Primary 4"
                  value={child.class.replace("custom:", "")}
                  onChange={(e) =>
                    updateChild("class", "custom:" + e.target.value)
                  }
                  ref={customClassRef}
                />
              </motion.div>
            )}

            {/* Subjects */}
            {child.class && !child.class.startsWith("custom") && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#023009] mb-3">
                    Enrolled Subjects ({child.subjects.length})
                  </label>
                  {child.subjects.length === 0 ? (
                    <p className="text-[#023009]/60 text-sm py-4 text-center">
                      No subjects selected.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {child.subjects.map((sid) => {
                        const sub = gradeSubjects.find((s) => s._id === sid);
                        if (!sub) return null;
                        return (
                          <div
                            key={sid}
                            className="flex items-center justify-between p-3 bg-[#f0fdf0] rounded-xl border border-[#ffd000]/30"
                          >
                            <div>
                              <span className="font-medium">{sub.name}</span>
                              <span className="text-xs text-[#023009]/60 ml-2">
                                ({sub.code})
                              </span>
                            </div>
                            <button
                              onClick={() => removeSubject(sid)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#023009] mb-3">
                    Add Subject
                  </label>
                  <LabeledSelect
                    label=""
                    value=""
                    onChange={(v) => {
                      if (v) addSubject(v);
                    }}
                    options={filteredSubjects.map((s) => ({
                      value: s._id,
                      label: `${s.name} (${s.code})`,
                    }))}
                    placeholder={
                      loadingSubjects ? "Loading..." : "Select subject"
                    }
                  />
                  <div className="mt-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#023009]/50" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-base rounded-xl border-2 border-[#ffd000]/50 focus:border-[#023009] focus:outline-none focus:ring-4 focus:ring-[#ffd000]/20 transition-all duration-200 bg-white text-[#023009]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={sendOtp}
            disabled={!isFormValid || otpLoading}
            className="w-full mt-8 bg-[#023009] text-white py-4 rounded-xl font-black text-lg hover:bg-[#023009]/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {otpLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Add Student
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* OTP MODAL */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <Lock className="w-12 h-12 text-[#023009] mx-auto mb-3" />
                <h3 className="text-xl font-black text-[#023009]">Enter OTP</h3>
                <p className="text-sm text-[#023009]/70 mt-1">
                  Sent to <strong>{parent.email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <InputWithIcon
                  ref={otpRef}
                  icon={Lock}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) setOtp(val);
                  }}
                  type="password"
                  showToggle
                  show={showOtp}
                  toggleShow={() => setShowOtp((s) => !s)}
                  className="text-center text-3xl font-bold tracking-widest"
                />
              </div>

              {otpMessage && (
                <p
                  className={`text-center mt-3 text-sm font-medium ${
                    otpMessage.includes("sent")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {otpMessage}
                </p>
              )}

              <div className="text-center mt-4">
                <button
                  onClick={resendOtp}
                  disabled={!canResend || otpLoading}
                  className={`inline-flex items-center gap-2 text-sm font-medium ${
                    canResend
                      ? "text-[#023009]/70 underline hover:text-[#023009]"
                      : "text-[#023009]/40"
                  }`}
                >
                  {otpLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : canResend ? (
                    <RefreshCw className="w-4 h-4" />
                  ) : (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}
                  {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtp("");
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={submitWithOtp}
                  disabled={otp.replace(/\D/g, "").length !== 6 || otpLoading}
                  className="flex-1 py-3 bg-[#023009] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {showResultModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center"
            >
              {resultSuccess ? (
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              ) : (
                <X className="w-16 h-16 text-red-600 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-black text-[#023009] mb-2">
                {resultSuccess ? "Success!" : "Error"}
              </h3>
              <p className="text-[#023009]/70">{resultMessage}</p>
              <button
                onClick={() => {
                  setShowResultModal(false);
                  if (resultSuccess) navigate(-1);
                }}
                className="mt-6 w-full py-3 bg-[#023009] text-white rounded-xl font-bold"
              >
                {resultSuccess ? "Back to Profile" : "Try Again"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddStudent;
