import { Camera, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '../../lib/api-client';
import { api } from '../../lib/api-client';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUrl: string | null;
  name: string;
}

export function ProfilePhotoModal({ open, onClose, currentUrl, name }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreview(null);
    setError('');
  }, [open]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (selected: File | undefined) => {
    setError('');
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Selecciona una imagen JPG, PNG o WEBP.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB.');
      return;
    }
    setFile(selected);
  };

  const save = async () => {
    if (!file) return;
    setPending(true);
    setError('');
    try {
      await api.updateProfilePhoto(file);
      toast.success('Foto de perfil actualizada');
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo subir la foto.');
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    setError('');
    try {
      await api.removeProfilePhoto();
      toast.success('Foto de perfil eliminada');
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar la foto.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Foto de perfil"
      description="JPG, PNG o WEBP. Tamaño máximo: 5 MB."
      size="sm"
      dismissible
      footer={
        <>
          {currentUrl && (
            <button type="button" onClick={() => void remove()} disabled={pending} className="btn btn-outline text-alert">
              <Trash2 className="size-4" />
              Eliminar
            </button>
          )}
          <button type="button" onClick={onClose} disabled={pending} className="btn btn-outline">
            Cancelar
          </button>
          <button type="button" onClick={() => void save()} disabled={!file || pending} className="btn btn-solid">
            <Upload className="size-4" />
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-32 place-items-center overflow-hidden rounded-full border border-line bg-concrete">
          {preview || currentUrl ? (
            <img src={preview || currentUrl || ''} alt={name} className="size-full object-cover" />
          ) : (
            <Camera className="size-8 text-graphite" />
          )}
        </div>
        <label className="btn btn-outline cursor-pointer">
          <Camera className="size-4" />
          Elegir imagen
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />
        </label>
        {error && <p role="alert" className="text-sm text-alert">{error}</p>}
      </div>
    </Modal>
  );
}
