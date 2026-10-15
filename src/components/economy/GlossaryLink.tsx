'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import Link from '@/components/I18n';
import {useReader} from './use-reader';
import styles from './economy.module.css';
export default function GlossaryLink({slug,name,summary,children}:{slug:string;name:string;summary:string;children:React.ReactNode}){const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),[open,setOpen]=useState(false),{e}=useReader();useEffect(()=>{if(open)dialog.current?.showModal();},[open]);function close(){setOpen(false);trigger.current?.focus();}return <><button ref={trigger} className={styles.termTrigger} type="button" aria-haspopup="dialog" onClick={()=>setOpen(true)}>{children}</button>{open&&createPortal(<dialog ref={dialog} className={styles.dialog} aria-label={name} onClose={close} onClick={event=>{if(event.target===dialog.current)dialog.current?.close();}}><strong>{name}</strong><p>{summary}</p><span className={styles.actions}><Link className={styles.button} href={'/glossary/'+slug}>{e('readMore')}</Link><button type="button" className={styles.button} autoFocus onClick={()=>dialog.current?.close()}>{e('close')}</button></span></dialog>,document.body)}</>;}
