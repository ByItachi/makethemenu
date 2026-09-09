
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, QrCode } from 'lucide-react';

const tables = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Masa ${i + 1}`,
}));

const TableQrCodes: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState('default');

  const generateQrCode = (tableId: number) => {
    // QR kod oluşturma mantığı buraya eklenecek
    console.log(`Generating QR code for table ${tableId} with theme ${selectedTheme}`);
  };

  const downloadQrCode = (tableId: number) => {
    // QR kod indirme mantığı buraya eklenecek
    console.log(`Downloading QR code for table ${tableId}`);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => (
          <Card key={table.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {table.name}
                <Button variant="ghost" size="icon" onClick={() => downloadQrCode(table.id)}>
                  <Download className="h-5 w-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-lg">
                <QrCode className="h-24 w-24 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TableQrCodes;
