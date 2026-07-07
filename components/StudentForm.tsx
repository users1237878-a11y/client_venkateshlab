
import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { X, Loader2 } from 'lucide-react';

interface StudentFormProps {
  student?: Student | null;
  tableNumber?: number;
  existingStudents: Student[];
  onSave: (student: Student) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  isSaving?: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({ 
  student, 
  tableNumber, 
  existingStudents, 
  onSave, 
  onClose,
  onDelete,
  isSaving = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    tableNumber: tableNumber || 0,
    joiningDate: new Date().toISOString().split('T')[0],
    monthlyFee: 1000, // Updated default fee to 1000
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        mobile: student.mobile,
        tableNumber: student.tableNumber,
        joiningDate: student.joiningDate,
        monthlyFee: student.monthlyFee,
      });
    }
  }, [student]);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDelete = () => {
    if (isConfirmingDelete) {
      if (student && onDelete) {
        onDelete(student.id);
      }
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmingDelete(false);
    setError('');

    if (isNaN(formData.tableNumber) || formData.tableNumber < 10 || formData.tableNumber > 60) {
      setError('Please enter a valid table number between 10 and 60.');
      return;
    }

    // Check duplicate table
    const duplicate = existingStudents.find(
      s => s.tableNumber === formData.tableNumber && s.id !== (student?.id || '')
    );
    if (duplicate) {
      setError(`Cannot assign Table #${formData.tableNumber}. It is already occupied by ${duplicate.name}.`);
      return;
    }

    const nextDue = student ? student.nextDueDate : formData.joiningDate;

    const newStudent: Student = {
      id: student?.id || crypto.randomUUID(),
      name: formData.name,
      mobile: formData.mobile,
      tableNumber: formData.tableNumber,
      joiningDate: formData.joiningDate,
      monthlyFee: formData.monthlyFee,
      lastPaidDate: student?.lastPaidDate || null,
      nextDueDate: nextDue,
      paymentHistory: student?.paymentHistory || [],
    };

    onSave(newStudent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">
            {student ? 'Edit Student Details' : `Enroll for Table #${formData.tableNumber}`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
            <input
              required
              type="tel"
              value={formData.mobile}
              onChange={e => {
                setFormData({ ...formData, mobile: e.target.value });
                setError('');
              }}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. 9876543210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Table #</label>
              <input
                required
                type="number"
                min="10"
                max="60"
                value={formData.tableNumber}
                onChange={e => {
                  setFormData({ ...formData, tableNumber: parseInt(e.target.value) });
                  setError('');
                }}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
              <input
                required
                type="date"
                value={formData.joiningDate}
                onChange={e => {
                  setFormData({ ...formData, joiningDate: e.target.value });
                  setError('');
                }}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Fee (₹)</label>
            <input
              required
              type="number"
              value={formData.monthlyFee}
              onChange={e => {
                setFormData({ ...formData, monthlyFee: parseInt(e.target.value) });
                setError('');
              }}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                student ? 'Update Student' : 'Save Enrollment'
              )}
            </button>
            {student && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className={`px-4 py-2.5 border font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${isConfirmingDelete ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-inner' : 'border-rose-200 text-rose-600 hover:bg-rose-50'}`}
              >
                {isSaving && isConfirmingDelete ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isConfirmingDelete ? (
                  'Confirm?'
                ) : (
                  'Delete'
                )}
              </button>
            )}
            {isConfirmingDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
