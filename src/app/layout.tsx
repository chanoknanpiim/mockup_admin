import type { Metadata } from 'next';
import './globals.css';
import { AdminDataProvider } from '@/context/AdminDataContext';
import AdminShell from '@/components/AdminShell';

export const metadata: Metadata = {
  title: 'ปลดปล่อย Admin | ระบบบริหารจัดการห้องน้ำ มธ. ท่าพระจันทร์',
  description: 'ระบบบริหารจัดการข้อมูลห้องน้ำและสิ่งอำนวยความสะดวก มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AdminDataProvider>
          <AdminShell>{children}</AdminShell>
        </AdminDataProvider>
      </body>
    </html>
  );
}
