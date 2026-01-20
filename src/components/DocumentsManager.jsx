import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileText, Trash2, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function DocumentsManager({ unitId }) {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (unitId) fetchDocuments();
    }, [unitId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('unit_id', unitId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (err) {
            console.error('Error fetching docs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`; // Store in user's folder

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('files')
                .getPublicUrl(filePath);

            // 3. Save to DB
            const { data, error: dbError } = await supabase
                .from('documents')
                .insert([{
                    user_id: user.id,
                    unit_id: unitId,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: publicUrl
                }])
                .select();

            if (dbError) throw dbError;

            setDocuments([data[0], ...documents]);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (id, url) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete from Storage (Optional optimisation, extracting path from URL)
            // URL format: .../storage/v1/object/public/files/USER_ID/FILENAME
            // We need: USER_ID/FILENAME
            const path = url.split('/files/')[1];
            if (path) {
                await supabase.storage.from('files').remove([path]);
            }

            setDocuments(documents.filter(d => d.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Delete failed');
        }
    };

    const getIcon = (type) => {
        if (type.includes('image')) return <ImageIcon size={20} className="text-purple-500" />;
        if (type.includes('pdf')) return <FileText size={20} className="text-rose-500" />;
        return <FileText size={20} className="text-slate-400" />;
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
                <input
                    type="file"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    {uploading ? <Loader2 className="animate-spin text-emerald-600" size={24} /> : <Upload className="text-emerald-600" size={24} />}
                </div>
                <p className="text-sm font-medium text-slate-900">{uploading ? 'Uploading...' : 'Click to upload contents'}</p>
                <p className="text-xs text-slate-500 mt-1">PDF, images, or docs (Max 5MB)</p>
            </div>

            {/* File List */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Files ({documents.length})</h4>

                {documents.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">No documents attached yet.</p>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg group hover:border-emerald-200 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {getIcon(doc.type || '')}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                                    <p className="text-[10px] text-slate-400">{formatBytes(doc.size)} • {new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Download/View"
                                >
                                    <ExternalLink size={16} />
                                </a>
                                <button
                                    onClick={() => handleDelete(doc.id, doc.url)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
