"use client";
import Link from 'next/link';

import React, { useState } from 'react'

const topStyle: React.CSSProperties = {
    height: '60px',
    display: 'flex',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    padding: '0 24px'
};

const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
}

const buttonStyle: React.CSSProperties = {
    marginLeft: 'auto',
    display: 'flex',
    gap: '16px',
};

const setStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#696969',
    color: 'white'
}

function Page() {
    return (
        <div style={topStyle}>
            <h1 style={titleStyle}>お店のルール例</h1>
            <div style={buttonStyle}>
                <Link href="./createRule">
                    <button style={setStyle}>
                        戻る
                    </button>
                </Link>
            </div>
        </div>
    ) 
}

export default Page;