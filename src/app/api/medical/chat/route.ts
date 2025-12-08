    } catch (error) {
    console.error("Medical Chat API Error:", error);
    return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
    );
}
}
