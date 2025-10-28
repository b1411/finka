'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
  status?: 'draft' | 'submitted' | 'approved';
  onSubmit?: () => void;
  onSave?: () => void;
  submitLabel?: string;
  saveLabel?: string;
  canSubmit?: boolean;
  canSave?: boolean;
  className?: string;
}

export function FormWrapper({
  title,
  description,
  children,
  isLoading = false,
  error = null,
  success = null,
  status = 'draft',
  onSubmit,
  onSave,
  submitLabel = 'Отправить',
  saveLabel = 'Сохранить',
  canSubmit = true,
  canSave = true,
  className = ''
}: FormWrapperProps) {

  const getStatusBadge = () => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Черновик</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700">Отправлено</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Утверждено</Badge>;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>
        
        {/* Уведомления */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Контент формы */}
        {children}
        
        {/* Кнопки действий */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          {onSave && canSave && (
            <Button
              variant="outline"
              onClick={onSave}
              disabled={isLoading || status === 'approved'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                saveLabel
              )}
            </Button>
          )}
          
          {onSubmit && canSubmit && (
            <Button
              onClick={onSubmit}
              disabled={isLoading || status === 'approved'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}