using System;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace RuinExt;

public class Processor
{
    //  Menerima teks dari Rust, memprosesnya, dan mengembalikan pointer
    [UnmanagedCallersOnly(EntryPoint = "ansi_syntax_highlighter")]
    public static IntPtr AnsiSyntaxHighlighter(IntPtr textPtr)
    {
        // Tangkap pointer dari Rust dan ubah jadi string C#
        string? input = Marshal.PtrToStringAnsi(textPtr);
        
        if (string.IsNullOrEmpty(input)) 
        {
            return IntPtr.Zero;
        }

        // LOGIC PEMROSESAN TEKS
        
        // Warna ANSI
        string reset = "\x1b[0m";
        string colorCyan = "\x1b[36m";   // Untuk kode (backtick)
        string colorYellow = "\x1b[33m"; // Untuk bold (**)
        
        string processed = input;

        // Regex untuk Bold (**teks**)
        processed = Regex.Replace(processed, @"\*\*(.*?)\*\*", $"{colorYellow}$1{reset}");
        
        // Regex untuk Inline Code (`kode`)
        processed = Regex.Replace(processed, @"\`(.*?)\`", $"{colorCyan}$1{reset}");

        return Marshal.StringToHGlobalAnsi(processed);
    }

    // mencegah Memory Leak
    [UnmanagedCallersOnly(EntryPoint = "free_csharp_string")]
    public static void FreeCSharpString(IntPtr ptr)
    {
        if (ptr != IntPtr.Zero)
        {
            Marshal.FreeHGlobal(ptr);
        }
    }
}