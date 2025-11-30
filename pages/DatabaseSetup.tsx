import React from 'react';
import { Copy, Terminal, FileCode, FolderTree, Database, Share2, AlertTriangle } from 'lucide-react';

const SQL_CONTENT = `
-- Backup Schema (Dự phòng)
-- Backend sẽ tự động tạo bảng.
-- Nếu cần reset, chạy lệnh này trong SQL Query Tool.

CREATE TYPE user_role AS ENUM ('ADMIN', 'KEEPER', 'STAFF', 'DIRECTOR');
-- ... (Schema content)
`;

const DatabaseSetup: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Share2 size={24} className="text-indigo-600"/>
            Cấu Hình Triển Khai (Dùng chung DB)
        </h2>
        
        <div className="mt-4 p-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 text-sm">
            <div className="flex items-center gap-2 font-bold mb-2">
                <FolderTree size={18} /> Kiến trúc tích hợp:
            </div>
            <p className="mb-2">
                Bạn đang triển khai ứng dụng vào hệ thống <code>my-smart-factory</code> đã có sẵn service <strong>postgres</strong>.
            </p>
            <ul className="list-disc ml-5 space-y-1">
                <li>Không tạo thêm service database mới.</li>
                <li>Backend Sông Bồ sẽ kết nối trực tiếp vào <code>postgres</code> container hiện tại.</li>
                <li>Port Frontend: <strong>8088</strong> | Port Backend: <strong>8090</strong></li>
            </ul>
        </div>

        <div className="mt-6 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Database size={20} className="text-green-600" /> 
                Kết nối Database (Shared Service)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-500 block mb-1">Target Service:</span>
                    <span className="font-bold text-green-700 text-lg">postgres</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-500 block mb-1">Target Database:</span>
                    <span className="font-bold text-slate-700">factory_db</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-500 block mb-1">Username:</span>
                    <span className="font-bold text-slate-700">root_user</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-500 block mb-1">Password:</span>
                    <span className="font-bold text-slate-700">root_password</span>
                </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0"/>
                <div>
                    <strong>Lưu ý quan trọng:</strong> Backend sẽ tự động tạo bảng (Tables) khi khởi động. <br/>
                    Tuy nhiên, bạn cần đảm bảo database tên <code>factory_db</code> đã tồn tại trong Postgres. <br/>
                    Nếu chưa, hãy chạy: <code>docker exec -it factory_postgres psql -U root_user -c "CREATE DATABASE factory_db;"</code>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;