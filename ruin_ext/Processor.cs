using System;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace RuinExt;

public class Processor
{
    [UnmanagedCallersOnly(EntryPoint = "ansi_syntax_highlighter")]
    public static IntPtr AnsiSyntaxHighlighter(IntPtr textPtr)
    {
        string? input = Marshal.PtrToStringAnsi(textPtr);
        
        if (string.IsNullOrEmpty(input)) 
        {
            return IntPtr.Zero;
        }

        // Warna ANSI Terminal
        string reset = "\x1b[0m";
        string colorGreen = "\x1b[32m";  // Untuk isi di dalam Code Block
        string colorCyan = "\x1b[36m";   // Untuk Inline Code
        string colorYellow = "\x1b[33m"; // Untuk Bold (**)
        
        string processed = input;

        // 1. REGEX UNTUK CODE BLOCK (```code```)
        processed = Regex.Replace(processed, @"```[a-zA-Z]*\r?\n?(.*?)\r?\n?```", 
            $"{colorGreen}$1{reset}", RegexOptions.Singleline);

        // REGEX UNTUK BOLD (**teks**)
        processed = Regex.Replace(processed, @"\*\*(.*?)\*\*", $"{colorYellow}$1{reset}");
        
        // REGEX UNTUK INLINE CODE (`kode`)
        processed = Regex.Replace(processed, @"\`(.*?)\`", $"{colorCyan}$1{reset}");

        return Marshal.StringToHGlobalAnsi(processed);
    }

    [UnmanagedCallersOnly(EntryPoint = "free_csharp_string")]
    public static void FreeCSharpString(IntPtr ptr)
    {
        if (ptr != IntPtr.Zero)
        {
            Marshal.FreeHGlobal(ptr);
        }
    }
}