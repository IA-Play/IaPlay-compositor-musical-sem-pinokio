
import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Type, Palette, Eraser } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (!contentRef.current) return;

        // On first mount, always set the content
        if (isInitialMount.current) {
            isInitialMount.current = false;
            contentRef.current.innerHTML = value || '';
            return;
        }

        // On subsequent updates, only sync if content differs (prevents cursor jumping)
        if (contentRef.current.innerHTML !== value) {
            if (value === '' && contentRef.current.innerHTML === '<br>') return;
            contentRef.current.innerHTML = value;
        }
    }, [value]);

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (contentRef.current) onChange(contentRef.current.innerHTML);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            exec('insertHTML', '<img src="https://media.tenor.com/On7kvXhzml4AAAAj/loading-gif.gif" id="loading-img" style="max-width:100%"/>');

            const res = await fetch('api/upload.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                const img = contentRef.current?.querySelector('#loading-img');
                if (img) img.remove();
                exec('insertHTML', `<img src="${data.url}" style="max-width:100%; border-radius: 8px; margin: 10px 0;" />`);
            } else {
                alert('Erro upload: ' + data.error);
                const img = contentRef.current?.querySelector('#loading-img');
                if (img) img.remove();
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar imagem.');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const ToolbarBtn = ({ icon: Icon, cmd, arg, title }: any) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); exec(cmd, arg); }}
            className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
            title={title}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className={`border border-white/10 rounded-lg overflow-hidden bg-black ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-zinc-900 border-b border-white/10">
                <ToolbarBtn icon={Bold} cmd="bold" title="Negrito" />
                <ToolbarBtn icon={Italic} cmd="italic" title="Itálico" />
                <ToolbarBtn icon={Underline} cmd="underline" title="Sublinhado" />
                <div className="w-px bg-white/10 mx-1 h-6 self-center" />
                <ToolbarBtn icon={Heading1} cmd="formatBlock" arg="H2" title="Título H2" />
                <ToolbarBtn icon={Heading2} cmd="formatBlock" arg="H3" title="Título H3" />
                <ToolbarBtn icon={Type} cmd="formatBlock" arg="P" title="Parágrafo" />
                <div className="w-px bg-white/10 mx-1 h-6 self-center" />
                <ToolbarBtn icon={AlignLeft} cmd="justifyLeft" title="Esquerda" />
                <ToolbarBtn icon={AlignCenter} cmd="justifyCenter" title="Centro" />
                <ToolbarBtn icon={AlignRight} cmd="justifyRight" title="Direita" />
                <div className="w-px bg-white/10 mx-1 h-6 self-center" />
                <div className="relative flex items-center justify-center p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Cor do Texto">
                    <Palette className="w-4 h-4 pointer-events-none" />
                    <input
                        type="color"
                        onInput={(e) => exec('foreColor', e.currentTarget.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <ToolbarBtn icon={Eraser} cmd="removeFormat" title="Limpar Formatação" />
                <div className="w-px bg-white/10 mx-1 h-6 self-center" />
                <ToolbarBtn icon={List} cmd="insertUnorderedList" title="Lista" />
                <ToolbarBtn icon={ListOrdered} cmd="insertOrderedList" title="Lista Ordenada" />
                <div className="w-px bg-white/10 mx-1 h-6 self-center" />
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const url = prompt('URL do Link:');
                        if (url) exec('createLink', url);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                    className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                    title="Upload Imagem"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            {/* Editor Area - dir="ltr" forces left-to-right text direction */}
            <div
                ref={contentRef}
                contentEditable
                dir="ltr"
                suppressContentEditableWarning
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ unicodeBidi: 'embed', direction: 'ltr' }}
                className="p-4 min-h-[300px] outline-none text-white prose prose-invert max-w-none prose-p:my-2 prose-headings:my-4"
            />
        </div>
    );
};

